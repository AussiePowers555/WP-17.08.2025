-- Workspace Security Setup
-- This script adds database-level security to prevent cross-workspace data access

-- 1. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_workspace_deleted 
ON cases(workspace_id, is_deleted) 
WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_case_id 
ON interactions(case_id);

CREATE INDEX IF NOT EXISTS idx_interactions_workspace_id 
ON interactions(workspace_id);

-- 2. Add check constraints to ensure data integrity
ALTER TABLE interactions 
ADD CONSTRAINT chk_interaction_workspace 
CHECK (workspace_id IS NOT NULL);

-- 3. Create a function to validate workspace access
CREATE OR REPLACE FUNCTION validate_workspace_access(
    user_workspace_id TEXT,
    user_role TEXT,
    requested_workspace_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Admins and developers can access any workspace
    IF user_role IN ('admin', 'developer') THEN
        RETURN TRUE;
    END IF;
    
    -- Other users can only access their assigned workspace
    IF user_workspace_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN user_workspace_id = requested_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a trigger to ensure interactions inherit workspace from case
CREATE OR REPLACE FUNCTION ensure_interaction_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Get workspace from the associated case
    IF NEW.case_id IS NOT NULL THEN
        SELECT workspace_id INTO NEW.workspace_id
        FROM cases 
        WHERE id = NEW.case_id;
        
        IF NEW.workspace_id IS NULL THEN
            RAISE EXCEPTION 'Case % not found or has no workspace', NEW.case_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_interaction_workspace ON interactions;
CREATE TRIGGER trg_ensure_interaction_workspace
BEFORE INSERT OR UPDATE ON interactions
FOR EACH ROW
EXECUTE FUNCTION ensure_interaction_workspace();

-- 5. Create views with built-in security for common queries
CREATE OR REPLACE VIEW secure_interactions AS
SELECT 
    i.*,
    c.workspace_id as case_workspace_id,
    c.client_name,
    c.status as case_status,
    c.is_deleted as case_deleted
FROM interactions i
INNER JOIN cases c ON i.case_id = c.id
WHERE c.is_deleted = false OR c.is_deleted IS NULL;

-- 6. Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    workspace_id VARCHAR(255),
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    action VARCHAR(50),
    success BOOLEAN,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON security_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event ON security_audit_log(event_type, created_at DESC);

-- 7. Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_user_id VARCHAR(255),
    p_user_email VARCHAR(255),
    p_workspace_id VARCHAR(255),
    p_resource_type VARCHAR(50),
    p_resource_id VARCHAR(255),
    p_action VARCHAR(50),
    p_success BOOLEAN,
    p_details JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO security_audit_log (
        event_type, user_id, user_email, workspace_id,
        resource_type, resource_id, action, success, details
    ) VALUES (
        p_event_type, p_user_id, p_user_email, p_workspace_id,
        p_resource_type, p_resource_id, p_action, p_success, p_details
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Fix any existing orphaned interactions (one-time cleanup)
UPDATE interactions i
SET workspace_id = c.workspace_id
FROM cases c
WHERE i.case_id = c.id
AND i.workspace_id IS NULL;

-- 9. Create stored procedures for secure operations
CREATE OR REPLACE FUNCTION get_workspace_interactions(
    p_user_id TEXT,
    p_user_role TEXT,
    p_user_workspace_id TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    id INT,
    case_number VARCHAR,
    interaction_type VARCHAR,
    contact_name VARCHAR,
    situation TEXT,
    action_taken TEXT,
    outcome TEXT,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- For non-admin users, force workspace filter
    IF p_user_role NOT IN ('admin', 'developer') THEN
        IF p_user_workspace_id IS NULL THEN
            RAISE EXCEPTION 'User has no workspace assigned';
        END IF;
        
        RETURN QUERY
        SELECT 
            i.id,
            i.case_number,
            i.interaction_type,
            i.contact_name,
            i.situation,
            i.action_taken,
            i.outcome,
            i.timestamp
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        WHERE c.workspace_id = p_user_workspace_id
        AND (c.is_deleted = false OR c.is_deleted IS NULL)
        ORDER BY i.timestamp DESC
        LIMIT p_limit
        OFFSET p_offset;
    ELSE
        -- Admins can see all
        RETURN QUERY
        SELECT 
            i.id,
            i.case_number,
            i.interaction_type,
            i.contact_name,
            i.situation,
            i.action_taken,
            i.outcome,
            i.timestamp
        FROM interactions i
        INNER JOIN cases c ON i.case_id = c.id
        WHERE c.is_deleted = false OR c.is_deleted IS NULL
        ORDER BY i.timestamp DESC
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_workspace_interactions TO PUBLIC;
GRANT EXECUTE ON FUNCTION validate_workspace_access TO PUBLIC;
GRANT EXECUTE ON FUNCTION log_security_event TO PUBLIC;
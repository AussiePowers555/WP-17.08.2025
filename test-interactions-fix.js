const { getInteractions } = require('./src/lib/actions/interactions.ts');

async function testInteractionsFix() {
  try {
    console.log('🧪 Testing interactions fix...');
    
    const workspaceId = '571ab2ed-e9b0-42f4-a09c-2e74c2af7e6d';
    
    // Test the getInteractions function with the workspace filter
    const result = await getInteractions(1, 20, {}, { field: 'timestamp', direction: 'desc' }, workspaceId);
    
    if (result.success && result.data) {
      console.log(`✅ Success! Found ${result.data.interactions.length} interactions`);
      console.log(`📊 Total count: ${result.data.totalCount}`);
      console.log(`📝 Sample interactions:`);
      
      result.data.interactions.slice(0, 5).forEach((int, idx) => {
        console.log(`${idx + 1}. ID: ${int.id} | Case: ${int.caseNumber} | Contact: ${int.contactName} | Type: ${int.interactionType}`);
      });
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInteractionsFix();
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, User, Lock, BookOpen, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  user: {
    id: string;
    email: string;
    role: string;
    workspaceId?: string;
  };
  onComplete?: () => void;
}

export function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
    changePassword: false
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to WhitePointer!',
      description: 'Let\'s get your account set up in just a few steps.',
      icon: Rocket
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help us personalize your experience.',
      icon: User
    },
    {
      id: 'password',
      title: 'Secure Your Account',
      description: 'Would you like to change your temporary password?',
      icon: Lock
    },
    {
      id: 'tour',
      title: 'Quick Tour',
      description: 'Learn about the key features of your workspace.',
      icon: BookOpen
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'You\'re ready to start using WhitePointer.',
      icon: CheckCircle2
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Mark current step as completed
    setCompletedSteps([...completedSteps, currentStep]);

    // Handle step-specific actions
    if (steps[currentStep].id === 'profile') {
      // Save profile data
      if (formData.fullName || formData.phone) {
        try {
          const response = await fetch('/api/auth/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              fullName: formData.fullName,
              phone: formData.phone
            })
          });

          if (!response.ok) {
            toast.error('Failed to update profile');
          }
        } catch (error) {
          console.error('Profile update error:', error);
        }
      }
    }

    if (steps[currentStep].id === 'password' && formData.changePassword) {
      // Handle password change
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }

      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            newPassword: formData.newPassword
          })
        });

        if (response.ok) {
          toast.success('Password updated successfully');
        } else {
          toast.error('Failed to update password');
        }
      } catch (error) {
        console.error('Password change error:', error);
        toast.error('Failed to update password');
      }
    }

    // Move to next step or complete
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      try {
        await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Onboarding completion error:', error);
      }

      if (onComplete) {
        onComplete();
      } else {
        router.push('/dashboard');
      }
    }
  };

  const handleSkip = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const Icon = step.icon;

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <Icon className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Your account has been created with the email: <strong>{user.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Role: <strong className="capitalize">{user.role.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name (optional)</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="changePassword"
                  checked={formData.changePassword}
                  onChange={(e) => setFormData({ ...formData, changePassword: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="changePassword">I want to change my password</Label>
              </div>
              {formData.changePassword && (
                <>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'tour':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Icon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Case Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Track and manage all your rental cases in one place
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Fleet Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your bike fleet, assignments, and availability
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Digital Signatures</h3>
                  <p className="text-sm text-muted-foreground">
                    Collect signatures electronically for rental agreements
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Workspace Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    Work together with your team in a shared workspace
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <Icon className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Click below to go to your dashboard and start using WhitePointer.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Progress value={progress} className="mb-4" />
          <CardTitle>Step {currentStep + 1} of {steps.length}</CardTitle>
          <CardDescription>
            {completedSteps.includes(currentStep) && (
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={currentStep === steps.length - 1}
          >
            Skip
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
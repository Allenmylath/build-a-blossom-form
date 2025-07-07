
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Building } from 'lucide-react';
import { useUserPlanState, useUserPlanActions } from '@/store';
import { PlanType } from '@/store/slices/userPlanSlice';
import { toast } from '@/hooks/use-toast';

const PLAN_FEATURES = {
  hobby: {
    name: 'Hobby Plan',
    price: 'Free',
    icon: Zap,
    color: 'bg-blue-500',
    features: [
      'Up to 5 forms',
      'Up to 100 submissions/month',
      'Up to 2 knowledge bases',
      'Basic form fields',
      'Email support',
    ],
    restrictions: [
      'No chat support',
      'No advanced analytics',
      'No custom branding',
      'No API access',
    ],
  },
  startup: {
    name: 'Startup Plan',
    price: '$19/month',
    icon: Crown,
    color: 'bg-purple-500',
    features: [
      'Up to 25 forms',
      'Up to 1,000 submissions/month',
      'Up to 10 knowledge bases',
      'Chat form support',
      'Advanced analytics',
      'API access',
      'Priority support',
    ],
    restrictions: [
      'No custom branding',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: '$99/month',
    icon: Building,
    color: 'bg-yellow-500',
    features: [
      'Unlimited forms',
      'Unlimited submissions',
      'Unlimited knowledge bases',
      'Chat form support',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'White-label solution',
      'Dedicated support',
    ],
    restrictions: [],
  },
};

export const PlanUpgrade = () => {
  const { userSubscription, planLimits } = useUserPlanState();
  const { updateUserPlan } = useUserPlanActions();

  const handlePlanUpgrade = async (planType: PlanType) => {
    if (planType === userSubscription?.plan_type) {
      toast({
        title: "Current Plan",
        description: "You are already on this plan.",
      });
      return;
    }

    // For demo purposes, we'll just update the plan directly
    // In a real app, this would integrate with Stripe
    const success = await updateUserPlan(planType);
    
    if (success) {
      toast({
        title: "Plan Updated",
        description: `Successfully upgraded to ${PLAN_FEATURES[planType].name}!`,
      });
    } else {
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {(Object.keys(PLAN_FEATURES) as PlanType[]).map((planType) => {
        const plan = PLAN_FEATURES[planType];
        const Icon = plan.icon;
        const isCurrentPlan = userSubscription?.plan_type === planType;

        return (
          <Card key={planType} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="text-center">
              <div className={`w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {isCurrentPlan && <Badge variant="secondary">Current</Badge>}
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-primary">
                {plan.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Included:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.restrictions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Not included:</h4>
                  {plan.restrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{restriction}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => handlePlanUpgrade(planType)}
                disabled={isCurrentPlan}
                variant={isCurrentPlan ? "secondary" : "default"}
              >
                {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

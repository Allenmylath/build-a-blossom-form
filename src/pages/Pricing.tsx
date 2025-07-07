import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseForms } from '@/hooks/useSupabaseForms';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { isHobbyPlan, savedForms } = useSupabaseForms(user);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Determine current plan and recommended upgrade
  const currentPlan = user ? (isHobbyPlan ? 'hobby' : 'startup') : null;
  const isNewUser = !user;
  const shouldHighlightStartup = isNewUser || isHobbyPlan;

  const plans = [
    {
      id: 'hobby',
      name: 'Hobby',
      price: '$0',
      period: '/forever',
      description: 'Perfect for personal projects and getting started',
      maxForms: 5,
      features: [
        'Up to 5 forms',
        'Form builder & templates',
        'Basic analytics',
        'Email notifications',
        'Knowledge base PDF upload',
        'Export functionality',
        'Public form sharing'
      ],
      excludedFeatures: [
        'Chat form option',
        'Advanced integrations',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      popular: false
    },
    {
      id: 'startup',
      name: 'Startup',
      price: '$29',
      period: '/month',
      description: 'Ideal for growing businesses and teams',
      maxForms: 'Unlimited',
      features: [
        'Unlimited forms',
        'All form types including chat forms',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
        'Team collaboration',
        'Advanced integrations',
        'Everything in Hobby plan'
      ],
      excludedFeatures: [],
      popular: true
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/'); // Redirect to sign up first
      return;
    }
    
    if (planId === currentPlan) {
      return; // Already on this plan
    }
    
    if (planId === 'hobby' && !isHobbyPlan) {
      // Downgrading from startup to hobby - might need special handling
      console.log('Downgrading to hobby plan');
    }
    
    setSelectedPlan(planId);
    // Here you would integrate with your payment processor
    console.log(`Selected plan: ${planId}`, { currentPlan, isHobbyPlan });
  };

  const getPlanButtonText = (planId: string) => {
    if (!user) {
      return planId === 'hobby' ? 'Get Started Free' : 'Sign Up to Upgrade';
    }
    
    if (planId === currentPlan) {
      return 'Current Plan';
    }
    
    if (planId === 'startup') {
      return isHobbyPlan ? 'Upgrade to Startup' : 'Switch to Startup';
    }
    
    return 'Switch to Hobby';
  };

  const isPlanDisabled = (planId: string) => {
    if (!user && planId === 'startup') {
      return false; // Allow signup for startup
    }
    return selectedPlan === planId || (user && planId === currentPlan);
  };

  const getPlanCardStyle = (planId: string) => {
    if (!user) {
      // New users - highlight startup as recommended
      if (planId === 'startup') {
        return 'border-purple-500 border-2 shadow-lg scale-105';
      }
      return 'border-gray-200 hover:shadow-lg';
    }
    
    // Existing users
    if (planId === currentPlan) {
      return 'border-green-500 border-2 bg-green-50';
    }
    
    if (shouldHighlightStartup && planId === 'startup') {
      return 'border-purple-500 border-2 shadow-lg scale-105';
    }
    
    return 'border-gray-200 hover:shadow-lg';
  };

  const getPlanBadge = (planId: string) => {
    if (!user) {
      if (planId === 'hobby') {
        return (
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
            <Zap className="w-3 h-3 mr-1" />
            Get Started Free
          </Badge>
        );
      }
      if (planId === 'startup') {
        return (
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        );
      }
    }
    
    if (user && planId === currentPlan) {
      return (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
          <Crown className="w-3 h-3 mr-1" />
          Current Plan
        </Badge>
      );
    }
    
    if (user && isHobbyPlan && planId === 'startup') {
      return (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
          <Star className="w-3 h-3 mr-1" />
          Recommended Upgrade
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free, upgrade when you need more power
          </p>
          
          {/* Current Status */}
          {user && (
            <div className="mb-8">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {isHobbyPlan ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 text-green-600" />
                    Currently on Free Hobby Plan ({savedForms.length}/5 forms used)
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2 text-purple-600" />
                    Currently on Startup Plan - Unlimited Forms
                  </>
                )}
              </Badge>
            </div>
          )}
          
          {!user && (
            <div className="mb-8">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Sign up now and start building forms for free
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = user && plan.id === currentPlan;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 ${getPlanCardStyle(plan.id)}`}
              >
                {getPlanBadge(plan.id)}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className={`text-2xl font-bold ${
                    isCurrentPlan ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {plan.name}
                    {isCurrentPlan && <Crown className="w-5 h-5 inline ml-2 text-green-600" />}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-4xl font-bold ${
                      isCurrentPlan ? 'text-green-700' : 
                      plan.id === 'hobby' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      <strong>Forms limit:</strong> {plan.maxForms}
                      {plan.id === 'hobby' && user && isHobbyPlan && (
                        <span className="ml-2 text-purple-600 font-medium">
                          ({savedForms.length}/5 used)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Included features:</h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.excludedFeatures.length > 0 && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-6">Not included:</h4>
                        {plan.excludedFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-500">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mt-8 ${
                      isCurrentPlan
                        ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                        : plan.id === 'hobby'
                        ? 'bg-green-600 hover:bg-green-700'
                        : shouldHighlightStartup || plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-lg' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    disabled={isPlanDisabled(plan.id)}
                  >
                    {selectedPlan === plan.id ? 'Processing...' : getPlanButtonText(plan.id)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              All plans include a 14-day free trial • No credit card required for Hobby plan
            </p>
            <p className="text-sm text-gray-500">
              Questions? Contact us at support@formbuilder.com
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
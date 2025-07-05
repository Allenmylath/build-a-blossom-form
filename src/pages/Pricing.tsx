
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'hobby',
      name: 'Hobby',
      price: '$9',
      period: '/month',
      description: 'Perfect for personal projects and small businesses',
      maxForms: 5,
      features: [
        'Up to 5 forms',
        'Form builder & templates',
        'Basic analytics',
        'Email notifications',
        'Knowledge base PDF upload',
        'Export functionality'
      ],
      excludedFeatures: [
        'Chat form option',
        'Advanced integrations',
        'Priority support'
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
        'Advanced integrations'
      ],
      excludedFeatures: [],
      popular: true
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would integrate with your payment processor
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect plan for your form building needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-purple-500 border-2' : 'border-gray-200'} hover:shadow-lg transition-shadow`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  {plan.description}
                </CardDescription>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <strong>Forms limit:</strong> {plan.maxForms}
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
                    plan.popular 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  disabled={selectedPlan === plan.id}
                >
                  {selectedPlan === plan.id ? 'Processing...' : `Get ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
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

import React from 'react'
import { Check } from 'lucide-react'

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for getting started with embedded analytics',
      features: [
        'Up to 5 dashboards',
        '10,000 monthly queries',
        'Basic chart types',
        'Community support',
        'TypeScript SDK',
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing teams that need more power and flexibility',
      features: [
        'Unlimited dashboards',
        '1M monthly queries',
        'All chart types',
        'Priority support',
        'White-label branding',
        'Advanced security',
        'Real-time collaboration',
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific requirements',
      features: [
        'Everything in Professional',
        'Unlimited queries',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom contracts',
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            All plans include our core features and 99.9% uptime SLA
          </p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            View detailed feature comparison →
          </a>
        </div>
      </div>
    </section>
  )
}

export default Pricing 
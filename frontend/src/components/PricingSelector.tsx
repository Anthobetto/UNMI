import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Star } from "lucide-react"

export interface Plan {
  id: 'templates' | 'chatbots'
  title: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: string[]
  ctaText: string
  isFeatured?: boolean
  icon?: React.ElementType
}

interface PricingTableProps {
  plans: Plan[]
  onSelectPlan: (planId: 'templates' | 'chatbots', isYearly: boolean) => void
}

// Individual Digit Animation Component
const AnimatedDigit: React.FC<{ digit: string; index: number }> = ({ digit, index }) => {
  return (
    <div className="relative overflow-hidden inline-block min-w-[1ch] text-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={digit}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ 
            duration: 0.3,
            delay: index * 0.05,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="block"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// Enhanced Scrolling Number Component with individual digit animations
const ScrollingNumber: React.FC<{ value: number }> = ({ value }) => {
  const numberString = value.toString()
  
  return (
    <div className="flex items-center">
      {numberString.split('').map((digit, index) => (
        <AnimatedDigit 
          key={`${value}-${index}`}
          digit={digit}
          index={index}
        />
      ))}
    </div>
  )
}

export const PricingSelector: React.FC<PricingTableProps> = ({ plans, onSelectPlan }) => {
  const [isYearly, setIsYearly] = useState(false)

  const getFeatureIcon = () => {
    return <Check className="w-4 h-4 text-green-500" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-16">
      {/* Header with Toggle */}
      <motion.div 
        className="text-center space-y-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-gray-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Selecciona tu Plan
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-500 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Elige el plan que mejor se adapte a tus necesidades. Comienza a automatizar y recuperar tus llamadas hoy mismo.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Tabs 
            value={isYearly ? "yearly" : "monthly"} 
            onValueChange={(value) => setIsYearly(value === "yearly")}
          >
            <TabsList className="flex w-full h-12 cursor-pointer bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="monthly" className="text-base font-medium cursor-pointer flex-1 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Mensual</TabsTrigger>
              <TabsTrigger value="yearly" className="text-base font-medium flex items-center gap-2 cursor-pointer flex-1 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Anual
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium ml-2">
                  Ahorra 20%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
          <motion.div
            key={plan.title}
            variants={cardVariants}
            className="relative"
          >
            {/* Featured Badge */}
            {plan.isFeatured && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
              >
                <div className="bg-[#FF0000] text-white px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
                  <Star className="w-3 h-3 fill-current" />
                  Recomendado
                </div>
              </motion.div>
            )}

            <div className={`
              relative h-full p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col
              ${plan.isFeatured 
                ? 'border-[#FF0000] bg-white shadow-xl ring-1 ring-red-100' 
                : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }
            `}>
              {/* Plan Header */}
              <div className="text-center space-y-4 mb-8">
                {Icon && (
                   <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-2xl mb-4 ${plan.isFeatured ? 'bg-red-50 text-[#FF0000]' : 'bg-gray-100 text-gray-600'}`}>
                     <Icon size={28} />
                   </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900">{plan.title}</h3>
                <p className="text-gray-500 min-h-[40px] text-sm">{plan.description}</p>
                
                {/* Animated Price with Scrolling Numbers */}
                <div className="space-y-2 pt-4">
                  <div className="text-5xl font-bold text-gray-900 flex items-center justify-center tracking-tighter">
                    €<ScrollingNumber value={isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly} />
                    <span className="text-lg text-gray-400 font-normal ml-1 tracking-normal">
                      /mes
                    </span>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-gray-500 flex items-center justify-center gap-2 h-6"
                  >
                    <span>{isYearly ? `facturado anualmente (€${plan.price.yearly})` : `facturado mensualmente`}</span>
                  </motion.div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-10 flex-grow pt-4 border-t border-gray-100">
                {plan.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 + featureIndex * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {getFeatureIcon()}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="mt-auto"
              >
                <Button
                  onClick={() => onSelectPlan(plan.id, isYearly)}
                  variant={plan.isFeatured ? "default" : "outline"}
                  size="lg"
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all shadow-md hover:shadow-lg ${plan.isFeatured ? 'bg-[#FF0000] hover:bg-[#cc0000] text-white hover:-translate-y-0.5' : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  {plan.ctaText}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )})}
      </motion.div>
    </div>
  )
}

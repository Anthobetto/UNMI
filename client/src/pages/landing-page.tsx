import { Button } from "@/components/ui/button";
import { OfficialLogo } from "@/components/logo/official-logo";
import { useLocation } from "wouter";
import { ArrowRight, MessageCircle, Phone, Clock, BarChart, Building } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <OfficialLogo width={180} />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="font-medium text-[#003366]"
              onClick={() => navigate("/auth")}
            >
              Login
            </Button>
            <Button
              className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F] text-white font-medium unmi-button-primary"
              onClick={() => navigate("/auth?tab=register")}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#003366] leading-tight mb-6">
            Transform Your Business Communication Strategy
          </h1>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Unmi seamlessly integrates WhatsApp, SMS, and call management into one powerful platform, 
            helping businesses convert more inquiries into bookings with intelligent routing and personalized responses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F] text-white font-medium text-lg px-8 py-6 unmi-button-primary"
              onClick={() => navigate("/auth?tab=register")}
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-[#003366] text-[#003366] font-medium text-lg px-8 py-6"
              onClick={() => window.open('#schedule-demo', '_blank')}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
        <div className="lg:w-1/2">
          <img 
            src="/assets/hero-dashboard.svg" 
            alt="Unmi Dashboard Preview" 
            className="rounded-2xl shadow-xl w-full"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#003366] mb-16">
            Why Businesses Choose Unmi
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <MessageCircle className="h-12 w-12 text-[#FF0000] mb-4" />
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Omnichannel Messaging
              </h3>
              <p className="text-gray-700">
                Seamlessly manage WhatsApp, SMS, and voice calls from one unified dashboard, ensuring no customer inquiry goes unanswered.
              </p>
            </div>
            
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <Phone className="h-12 w-12 text-[#FF0000] mb-4" />
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Intelligent Call Routing
              </h3>
              <p className="text-gray-700">
                Our smart routing system ensures calls reach the right location or department, reducing missed opportunities and improving customer satisfaction.
              </p>
            </div>
            
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <Clock className="h-12 w-12 text-[#FF0000] mb-4" />
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Automated Responses
              </h3>
              <p className="text-gray-700">
                Instantly engage with customers even outside business hours with intelligent templates that provide the information they need.
              </p>
            </div>
            
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <BarChart className="h-12 w-12 text-[#FF0000] mb-4" />
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Performance Analytics
              </h3>
              <p className="text-gray-700">
                Gain valuable insights with comprehensive analytics on call volumes, response times, and conversion rates to optimize your communication strategy.
              </p>
            </div>
            
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <Building className="h-12 w-12 text-[#FF0000] mb-4" />
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Multi-Location Support
              </h3>
              <p className="text-gray-700">
                Easily manage multiple business locations from a single dashboard, with customized settings and reporting for each site.
              </p>
            </div>
            
            <div className="bg-[#f8f7f4] p-8 rounded-xl">
              <div className="rounded-full bg-[#FF0000] h-12 w-12 flex items-center justify-center text-white font-bold text-2xl mb-4">€</div>
              <h3 className="text-xl font-semibold text-[#003366] mb-3">
                Revenue Calculator
              </h3>
              <p className="text-gray-700">
                Our integrated calculator helps you track the direct financial impact of improved communication, showing the ROI of your Unmi investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-[#003366] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">
            Trusted by Leading Businesses
          </h2>
          
          <div className="max-w-3xl mx-auto bg-[#004080] p-8 rounded-xl">
            <p className="text-xl italic mb-6">
              "Since implementing Unmi, we've seen a 37% increase in successful bookings and a dramatic decrease in missed calls. The multi-location support has been game-changing for our chain of restaurants."
            </p>
            <div>
              <p className="font-bold">Maria Rodriguez</p>
              <p className="text-sm opacity-80">Operations Director, Pastelería Paco</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#f8f7f4]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#003366] mb-6">
            Ready to Transform Your Business Communication?
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Start your free trial today and experience how Unmi can help your business convert more inquiries into bookings.
          </p>
          <Button
            size="lg"
            className="rounded-full bg-[#FF0000] hover:bg-[#D32F2F] text-white font-medium text-lg px-10 py-6 unmi-button-primary"
            onClick={() => navigate("/auth?tab=register")}
          >
            Start Free 14-Day Trial
          </Button>
          <p className="mt-4 text-sm text-gray-600">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <OfficialLogo width={120} />
            </div>
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Unmi. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
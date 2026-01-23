import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface CTASectionProps {
  whatsappNumber?: string;
}

export function CTASection({ whatsappNumber = '5511999999999' }: CTASectionProps) {
  const whatsappMessage = encodeURIComponent('Olá! Quero saber mais sobre o Pole Planner para meu studio.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          
          <div className="relative text-center">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Pronta para transformar seu studio?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Junte-se a centenas de profissionais que já estão usando o Pole Planner para crescer seus negócios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="xl" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar pelo WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

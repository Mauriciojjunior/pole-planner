import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Calendar } from 'lucide-react';

interface CTASectionProps {
  whatsappNumber?: string;
}

export function CTASection({ whatsappNumber = '5511999999999' }: CTASectionProps) {
  const whatsappMessage = encodeURIComponent('Olá! Quero saber mais sobre o Pole Agenda para meu studio.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-hero-pattern" />
          </div>
          
          {/* Decorative Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative text-center">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-background mb-6">
              Pronta para transformar seu studio?
            </h2>
            <p className="text-background/70 text-lg max-w-2xl mx-auto mb-10">
              Junte-se a centenas de profissionais que já estão usando o Pole Agenda 
              para crescer seus negócios e conectar com mais alunas.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button 
                  size="xl" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg min-w-[200px]"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Começar Gratuitamente
                </Button>
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="xl" 
                  variant="outline" 
                  className="border-background/30 text-background hover:bg-background/10 min-w-[200px]"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar pelo WhatsApp
                </Button>
              </a>
            </div>

            <p className="mt-8 text-sm text-background/50">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

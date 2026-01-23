import { Link } from 'react-router-dom';
import { MessageCircle, Instagram, Mail, Heart } from 'lucide-react';

interface FooterProps {
  whatsappNumber?: string;
}

export function Footer({ whatsappNumber = '5511999999999' }: FooterProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold">P</span>
              </div>
              <span className="font-display font-semibold text-foreground text-lg">Pole Agenda</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              A plataforma completa para agendamento e gestão de studios de pole dance.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/poleagenda" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="mailto:contato@poleagenda.com.br"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Produto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#funcionalidades" className="hover:text-foreground transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#precos" className="hover:text-foreground transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <Link to="/teachers" className="hover:text-foreground transition-colors">
                  Encontrar Professoras
                </Link>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-foreground transition-colors">
                  Depoimentos
                </a>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Status do Sistema
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  LGPD
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pole Agenda. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Feito com <Heart className="h-4 w-4 text-primary fill-primary" /> para a comunidade pole
          </p>
        </div>
      </div>
    </footer>
  );
}

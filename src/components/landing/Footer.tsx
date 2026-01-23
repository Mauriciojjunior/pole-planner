import { Link } from 'react-router-dom';
import { MessageCircle, Instagram, Mail } from 'lucide-react';

interface FooterProps {
  whatsappNumber?: string;
}

export function Footer({ whatsappNumber = '5511999999999' }: FooterProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">P</span>
              </div>
              <span className="font-display font-semibold text-gradient">Pole Planner</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              A plataforma completa para gestão de studios de pole dance.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/poleplanner" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="mailto:contato@poleplanner.com.br"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
              </li>
              <li>
                <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
              </li>
              <li>
                <Link to="/teachers" className="hover:text-foreground transition-colors">Encontrar Professoras</Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
                <a href="#" className="hover:text-foreground transition-colors">Status do Sistema</a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">LGPD</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pole Planner. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Feito com 💜 para a comunidade pole
          </p>
        </div>
      </div>
    </footer>
  );
}

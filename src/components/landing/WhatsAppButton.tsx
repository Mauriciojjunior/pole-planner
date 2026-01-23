import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function WhatsAppButton({ 
  phoneNumber = '5511999999999', 
  message = 'Olá! Gostaria de saber mais sobre o Pole Agenda.',
  className = ''
}: WhatsAppButtonProps) {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full px-5 py-3.5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group ${className}`}
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="font-medium text-sm hidden sm:inline">Fale Conosco</span>
    </a>
  );
}

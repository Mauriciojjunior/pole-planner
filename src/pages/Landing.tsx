import { SEOHead } from '@/components/public/SEOHead';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { WhatsAppButton } from '@/components/landing/WhatsAppButton';

// Número de WhatsApp configurável - altere aqui para seu número
const WHATSAPP_NUMBER = '5511999999999';

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pole Planner',
    description: 'Plataforma completa para gestão de studios de pole dance. Agendamento online, gestão de alunas, pagamentos e relatórios.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://poleplanner.com.br',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Plano gratuito disponível',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '500',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'Pole Planner',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pole Planner',
    url: 'https://poleplanner.com.br',
    logo: 'https://poleplanner.com.br/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${WHATSAPP_NUMBER}`,
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
    sameAs: [
      'https://instagram.com/poleplanner',
    ],
  };

  return (
    <>
      <SEOHead
        title="Pole Planner - Gestão de Studios de Pole Dance"
        description="Plataforma completa para gestão de studios de pole dance. Agendamento online, gestão de alunas, pagamentos integrados e relatórios detalhados. Comece grátis!"
        keywords={[
          'pole dance',
          'gestão de studio',
          'agendamento de aulas',
          'pole fitness',
          'professora de pole dance',
          'sistema para studio',
          'gestão de alunas',
          'studio de pole',
          'software para studio',
          'pole dance brasil',
        ]}
        ogType="website"
        ogImage="https://poleplanner.com.br/og-image.jpg"
        canonicalUrl="https://poleplanner.com.br"
        jsonLd={jsonLd}
      />

      {/* Additional structured data for organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
          <PricingSection />
          <CTASection whatsappNumber={WHATSAPP_NUMBER} />
        </main>
        <Footer whatsappNumber={WHATSAPP_NUMBER} />
        <WhatsAppButton 
          phoneNumber={WHATSAPP_NUMBER}
          message="Olá! Gostaria de saber mais sobre o Pole Planner para meu studio."
        />
      </div>
    </>
  );
}

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
    name: 'Pole Agenda',
    description: 'Plataforma completa de agendamento e gestão para studios de pole dance. Encontre aulas, gerencie sua agenda e cresça seu negócio.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://poleagenda.com.br',
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
      name: 'Pole Agenda',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pole Agenda',
    url: 'https://poleagenda.com.br',
    logo: 'https://poleagenda.com.br/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${WHATSAPP_NUMBER}`,
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
    sameAs: [
      'https://instagram.com/poleagenda',
    ],
  };

  return (
    <>
      <SEOHead
        title="Pole Agenda - Agendamento e Vitrine para Pole Dancers"
        description="Encontre aulas de pole dance ou gerencie seu studio. Agendamento online, gestão de alunas, pagamentos integrados e vitrine profissional. Comece grátis!"
        keywords={[
          'pole dance',
          'agendamento pole dance',
          'aulas de pole',
          'studio de pole',
          'professora de pole dance',
          'pole fitness',
          'gestão de studio',
          'agendar aula pole',
          'pole dance brasil',
          'plataforma pole dance',
        ]}
        ogType="website"
        ogImage="https://poleagenda.com.br/og-image.jpg"
        canonicalUrl="https://poleagenda.com.br"
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
          message="Olá! Gostaria de saber mais sobre o Pole Agenda para meu studio."
        />
      </div>
    </>
  );
}

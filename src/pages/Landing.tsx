import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/public/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Easy Scheduling',
    description: 'Book classes with just a few clicks. View real-time availability.',
  },
  {
    icon: Users,
    title: 'Expert Teachers',
    description: 'Connect with verified, experienced teachers in various subjects.',
  },
  {
    icon: Clock,
    title: 'Flexible Times',
    description: 'Find classes that fit your schedule, any time of day.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Your data is protected with enterprise-grade security.',
  },
  {
    icon: Zap,
    title: 'Instant Confirmation',
    description: 'Get immediate booking confirmation and reminders.',
  },
  {
    icon: GraduationCap,
    title: 'Track Progress',
    description: 'Monitor your learning journey with detailed history.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Student',
    content: 'Found an amazing piano teacher and booked my first lesson in minutes!',
    rating: 5,
  },
  {
    name: 'John D.',
    role: 'Teacher',
    content: 'Managing my schedule has never been easier. Love the automation!',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Student',
    content: 'The availability calendar makes it so easy to find the right time.',
    rating: 5,
  },
];

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ClassBook',
    description: 'Book classes with expert teachers online',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1000',
    },
  };

  return (
    <>
      <SEOHead
        title="ClassBook - Book Classes with Expert Teachers"
        description="Find and book classes with expert teachers online. Easy scheduling, real-time availability, and instant confirmation. Start learning today!"
        keywords={[
          'online classes',
          'book lessons',
          'find teachers',
          'online tutoring',
          'class scheduling',
          'private lessons',
        ]}
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <nav className="flex h-16 items-center justify-between">
              <Link to="/" className="text-xl font-bold text-primary">
                ClassBook
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  to="/teachers"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Find Teachers
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/5 to-background py-20 sm:py-32">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Star className="h-4 w-4 fill-primary" />
              Trusted by 10,000+ learners
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Learn from the{' '}
              <span className="text-primary">Best Teachers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Find expert teachers, view real-time availability, and book classes
              instantly. Your learning journey starts here.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/teachers">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Teachers
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/auth">
                  Start Teaching
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything You Need to Learn
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform makes it easy to find teachers, book classes, and track your progress.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 sm:py-32 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Find a Teacher', description: 'Browse our directory and find the perfect teacher for your goals.' },
                { step: '2', title: 'Check Availability', description: 'View real-time schedules and find times that work for you.' },
                { step: '3', title: 'Book & Learn', description: 'Confirm your booking and start your learning journey.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                What Our Users Say
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of satisfied learners and teachers
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground">&quot;{testimonial.content}&quot;</p>
                    <div className="mt-4 pt-4 border-t">
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Start Learning?
            </h2>
            <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
              Join our community of learners and teachers today. It's free to get started.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link to="/teachers">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Find Teachers
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/auth">
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="text-xl font-bold text-primary mb-4">ClassBook</div>
                <p className="text-sm text-muted-foreground">
                  The easiest way to find and book classes with expert teachers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/teachers" className="hover:text-foreground transition-colors">Find Teachers</Link></li>
                  <li><Link to="/auth" className="hover:text-foreground transition-colors">Become a Teacher</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} ClassBook. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

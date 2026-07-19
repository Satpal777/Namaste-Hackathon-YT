'use client';

import { Play, MessageSquare, Award, Clock, ArrowRight, Sparkles, SquarePlay, CheckCircle, GraduationCap, Code } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 antialiased overflow-x-hidden relative">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-secondary/15 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-muted/50 bg-background/80 backdrop-blur-md px-6 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-primary-foreground shadow-md shadow-primary/10">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-md font-extrabold tracking-tight text-foreground">
                Ask Namaste JavaScript
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[0.65rem] font-bold px-2 py-0">
                AI Engine
              </Badge>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-4">
            <Link 
              href="/how-it-works"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
            >
              How It Works
            </Link>
            <Button size="sm" asChild className="rounded-xl font-bold cursor-pointer shadow-sm">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 flex-1">
        <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 animate-fade-in">
            <Sparkles className="size-3.5 fill-current" />
            <span>Interactive JavaScript Mastery Dashboard</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
            Master JavaScript with{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI-Powered Video Search
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            Ask complex questions about Akshay Saini&apos;s famous &quot;Namaste JavaScript&quot; series. 
            Get detailed answers instantly cited with precise timestamp links straight to the video course.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-16">
            <Button size="lg" asChild className="w-full sm:w-auto rounded-2xl font-bold text-base px-8 py-6 shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all cursor-pointer">
              <Link href="/dashboard">
                Launch Chat & Quizzes
                <ArrowRight className="size-5 ml-1.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-2xl font-bold text-base px-8 py-6 border-muted hover:border-primary/25 cursor-pointer bg-card/50">
              <Link href="/how-it-works">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
            <div className="flex flex-col items-center p-6 rounded-2xl border border-muted bg-card/35 backdrop-blur-sm transition-all hover:border-primary/20">
              <span className="text-3xl font-black text-foreground">17</span>
              <span className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Videos Fully Indexed</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl border border-muted bg-card/35 backdrop-blur-sm transition-all hover:border-primary/20">
              <span className="text-3xl font-black text-foreground">100%</span>
              <span className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Semantic Search Accuracy</span>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl border border-muted bg-card/35 backdrop-blur-sm transition-all hover:border-primary/20">
              <span className="text-3xl font-black text-foreground">Instant</span>
              <span className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Video Time References</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Core Features Section */}
      <section className="py-20 bg-muted/10 border-t border-muted/50 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              Unleash the Power of AI Citation Search
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Don&apos;t waste hours scanning YouTube videos. Ask our AI Assistant and get summarized answers linked back to source segments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col p-8 rounded-2xl border border-muted/70 bg-card hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <MessageSquare className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Smart Chat Assistant</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Query JavaScript concepts like Hoisting, Closures, and Event Loop. Our AI synthesizes precise responses instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col p-8 rounded-2xl border border-muted/70 bg-card hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Clock className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Video Timestamp Links</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every generated answer includes clickable timestamps. Click them to launch the exact second Akshay Saini teaches that concept.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col p-8 rounded-2xl border border-muted/70 bg-card hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Award className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Interview Prep Quizzes</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Assess your JavaScript skill level. Select Easy, Medium, or Hard difficulty to run customized multiple choice test sets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus / Course Index Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="border border-muted rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-card to-muted/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-secondary/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-md">
                <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/25 mb-4">
                  <SquarePlay className="size-3.5 mr-1 fill-current" />
                  Namaste JavaScript Indexed
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-4">
                  Learn Core Concepts Confidently
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We have mapped out the entire series syllabus. Click search topics instantly on your dashboard:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>How JS Works</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>Hoisting</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>Call Stack</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>Scope Chain</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>Closures</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-background/50 border border-muted px-4 py-2.5 rounded-xl">
                  <CheckCircle className="size-3.5 text-primary" />
                  <span>Promises & API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-muted/5 border-t border-muted/50 px-6 text-center">
        <div className="mx-auto max-w-xl flex flex-col items-center">
          <GraduationCap className="size-12 text-primary mb-6 animate-pulse" />
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">Ready to Level Up Your JS Skills?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Access the chatbot assistant or run targeted practice quizzes now. Make standard interviews feel effortless.
          </p>
          <Button size="lg" asChild className="rounded-2xl font-bold px-10 py-6 cursor-pointer shadow-md">
            <Link href="/dashboard">
              Start Learning Now
              <ArrowRight className="size-4.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-muted/50 bg-card/45 px-6 py-8 mt-auto text-center text-[0.7rem] text-muted-foreground leading-relaxed">
        <div className="mx-auto max-w-4xl flex flex-col gap-2 items-center justify-center">
          <p className="font-bold text-foreground">
            Ask Namaste JavaScript &bull; AI Citation Engine
          </p>
          <p className="max-w-2xl text-muted-foreground/80">
            Disclaimer: This is an unofficial, non-commercial hackathon project created solely for educational demonstration purposes. All course materials, video streams, transcripts, and branding are the exclusive property of Akshay Saini. 
          </p>
          <p className="text-muted-foreground/60 text-[0.65rem]">
            Privacy: We value your privacy. No personal user data collected by this application.
          </p>
        </div>
      </footer>
    </div>
  );
}

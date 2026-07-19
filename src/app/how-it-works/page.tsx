'use client';

import { Play, ArrowLeft, ArrowRight, Database, Search, Cpu, ListChecks, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Database className="size-6 text-primary" />,
      title: "1. Video Indexing & Transcription",
      description: "We retrieve the Namaste JavaScript video series playlist, parsing timestamps and transcript logs to divide them into granular, searchable pieces."
    },
    {
      icon: <Cpu className="size-6 text-primary" />,
      title: "2. Vector Embedding Generation",
      description: "Each transcript segment is converted into a high-dimensional dense vector representing the semantic meaning of the words spoken in the video."
    },
    {
      icon: <Search className="size-6 text-primary" />,
      title: "3. Semantic Context Retrieval",
      description: "When you ask a question, the system vectorizes your query and performs a similarity search to fetch the most relevant video segments."
    },
    {
      icon: <MessageSquare className="size-6 text-primary" />,
      title: "4. LLM Synthesis & Verification",
      description: "The AI model processes the user query along with retrieved transcripts to generate a precise answer, citing the source material exclusively."
    },
    {
      icon: <Clock className="size-6 text-primary" />,
      title: "5. Exact Timestamp Mapping",
      description: "Citations are transformed into dynamic links targeting the exact video second. Click on any reference to watch Akshay Saini explain it."
    },
    {
      icon: <ListChecks className="size-6 text-primary" />,
      title: "6. Assessment & Quiz Prep",
      description: "Using the same transcripts, the engine drafts custom practice interview quiz questions tailored to your target difficulty level."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 antialiased overflow-x-hidden relative">
      
      {/* Decorative Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

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
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>Back Home</span>
            </Link>
            <Button size="sm" asChild className="rounded-xl font-bold cursor-pointer shadow-sm">
              <Link href="/dashboard">
                Launch Dashboard
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 mb-4 px-3 py-1 text-xs font-semibold">
            Technical Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
            How the Citation Engine Works
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            By connecting state-of-the-art Vector DB indexers with large language models, we bridge the gap between video tutorials and text retrieval.
          </p>
        </div>

        {/* Steps Grid/Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="flex flex-col p-6 rounded-2xl border border-muted bg-card hover:border-primary/25 hover:shadow-sm transition-all"
            >
              <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                {step.icon}
              </div>
              <h3 className="text-md font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call-to-action Banner */}
        <div className="border border-muted rounded-3xl p-8 sm:p-10 bg-gradient-to-tr from-muted/20 to-card text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/[0.02] pointer-events-none" />
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-3">
            Start Learning Efficiently Today
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8">
            Experience semantic searches and tailored JavaScript interview prep assessments now.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto rounded-2xl font-bold cursor-pointer">
              <Link href="/dashboard">
                Open App Dashboard
                <ArrowRight className="size-4.5 ml-1.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-2xl font-bold cursor-pointer border-muted hover:border-primary/20 bg-background/50">
              <Link href="/">
                Go Back Home
              </Link>
            </Button>
          </div>
        </div>

      </main>

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
            Privacy: We value your privacy. No personal user data or search query logs are stored or collected by this application.
          </p>
        </div>
      </footer>
    </div>
  );
}

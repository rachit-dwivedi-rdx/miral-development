import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, Zap, Users, ExternalLink } from 'lucide-react';

const LEARNING_RESOURCES = [
  {
    id: 1,
    title: 'The Secret to Great Public Speaking',
    description: 'TED Talk by Chris Anderson on the power of eye contact and authentic communication',
    type: 'Video',
    icon: Video,
    duration: '18 min watch',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=w82a1FQzVzE',
    source: 'TED',
    color: 'from-red-500/20 to-red-600/20',
  },
  {
    id: 2,
    title: 'Toastmasters: How to Reduce Filler Words',
    description: 'Official guide from Toastmasters on eliminating "um," "uh," and improving speech clarity',
    type: 'Article',
    icon: BookOpen,
    duration: '7 min read',
    level: 'Beginner',
    url: 'https://www.toastmasters.org/resources/public-speaking-tips',
    source: 'Toastmasters',
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    id: 3,
    title: 'Professional Posture for Confident Speaking',
    description: 'Expert guide on using posture to project confidence and authority in presentations',
    type: 'Video',
    icon: Video,
    duration: '15 min watch',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=ziDQodqJ1Bc',
    source: 'Skillshare',
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    id: 4,
    title: 'Speaking Rate and Pace Mastery',
    description: 'Learn how to control your speaking pace and use strategic pauses for maximum impact',
    type: 'Article',
    icon: BookOpen,
    duration: '6 min read',
    level: 'Intermediate',
    url: 'https://www.mindtools.com/pages/article/public-speaking.htm',
    source: 'MindTools',
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    id: 5,
    title: 'Body Language Secrets of Great Speakers',
    description: 'Comprehensive guide on using body language and posture to enhance your presentations',
    type: 'Guide',
    icon: Zap,
    duration: '12 min read',
    level: 'Intermediate',
    url: 'https://www.inc.com/articles/201411/15-powerful-public-speaking-tips.html',
    source: 'Inc.com',
    color: 'from-orange-500/20 to-orange-600/20',
  },
  {
    id: 6,
    title: 'The Science of Nonverbal Communication',
    description: 'Research-backed insights on how body language affects audience perception and confidence',
    type: 'Article',
    icon: BookOpen,
    duration: '8 min read',
    level: 'Advanced',
    url: 'https://www.psychologytoday.com/us/basics/body-language',
    source: 'Psychology Today',
    color: 'from-pink-500/20 to-pink-600/20',
  },
  {
    id: 7,
    title: 'Storytelling for Powerful Presentations',
    description: 'Learn from professional speakers how to craft and deliver stories that captivate audiences',
    type: 'Video',
    icon: Video,
    duration: '20 min watch',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=VKrq2pX8e-w',
    source: 'Presentation Guru',
    color: 'from-cyan-500/20 to-cyan-600/20',
  },
  {
    id: 8,
    title: 'Overcoming Public Speaking Anxiety',
    description: 'Evidence-based strategies from psychologists to manage nervousness and boost confidence',
    type: 'Article',
    icon: BookOpen,
    duration: '9 min read',
    level: 'Beginner',
    url: 'https://www.verywellmind.com/how-to-overcome-fear-of-public-speaking-3024588',
    source: 'Verywell Mind',
    color: 'from-indigo-500/20 to-indigo-600/20',
  },
  {
    id: 9,
    title: 'Engage Your Audience Masterclass',
    description: 'Practical techniques to capture and maintain attention throughout your entire presentation',
    type: 'Guide',
    icon: Users,
    duration: '11 min read',
    level: 'Intermediate',
    url: 'https://www.forbes.com/sites/carminegallo/2015/01/15/10-effective-tips-for-engaging-an-audience/',
    source: 'Forbes',
    color: 'from-teal-500/20 to-teal-600/20',
  },
  {
    id: 10,
    title: 'Professional Communication Skills',
    description: 'Comprehensive video course on essential speaking skills from industry experts',
    type: 'Video',
    icon: Video,
    duration: '30 min course',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=DYTF8WchIJY',
    source: 'LinkedIn Learning',
    color: 'from-violet-500/20 to-violet-600/20',
  },
];

export default function LearningResources() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Learning Resources</h1>
          <p className="text-muted-foreground">Master the skills to become a confident public speaker with curated content from industry experts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEARNING_RESOURCES.map((resource) => {
            const Icon = resource.icon;
            const levelColor: Record<string, string> = {
              Beginner: 'bg-green-500/20 text-green-700 dark:text-green-400',
              Intermediate: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
              Advanced: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
            };
            return (
              <Card
                key={resource.id}
                className="border-2 border-primary/10 hover:border-primary/30 transition-all hover-elevate overflow-hidden"
              >
                <CardHeader className={`bg-gradient-to-r ${resource.color}`}>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{resource.type}</Badge>
                    <Badge className={levelColor[resource.level as keyof typeof levelColor]}>
                      {resource.level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{resource.duration}</span>
                    <span className="font-medium">{resource.source}</span>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    variant="secondary"
                    onClick={() => window.open(resource.url, '_blank')}
                    data-testid={`button-resource-${resource.id}`}
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Recommended Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Badge className="mb-2">Week 1: Foundations</Badge>
              <p className="text-muted-foreground">Start with beginner resources on eye contact, pacing, and managing anxiety</p>
            </div>
            <div>
              <Badge className="mb-2">Week 2-3: Build Skills</Badge>
              <p className="text-muted-foreground">Progress to intermediate content on posture, storytelling, and engagement</p>
            </div>
            <div>
              <Badge className="mb-2">Week 4+: Master</Badge>
              <p className="text-muted-foreground">Explore advanced techniques and combine multiple skills for professional delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, Zap, Users, ExternalLink } from 'lucide-react';

const LEARNING_RESOURCES = [
  {
    id: 1,
    title: 'TED Talk: The Power of Eye Contact',
    description: 'Award-winning speaker shares scientifically-proven techniques on maintaining eye contact during presentations',
    type: 'Video',
    icon: Video,
    duration: '18 min watch',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=UH0QjvB8o7I&t=12s',
    source: 'TED-Ed',
    color: 'from-red-500/20 to-red-600/20',
  },
  {
    id: 2,
    title: 'How to Eliminate Filler Words',
    description: 'Practical guide from Toastmasters International on removing "um", "uh", and "like" from your speech',
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
    title: 'Body Language and Posture for Public Speakers',
    description: 'Expert training on using confident posture to command attention and convey authority',
    type: 'Video',
    icon: Video,
    duration: '15 min watch',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=1Kzlf8gXPHk',
    source: 'Speak With No Fear',
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    id: 4,
    title: 'Speaking Pace and Pausing Techniques',
    description: 'Master the art of strategic pauses and pacing to improve comprehension and engagement',
    type: 'Article',
    icon: BookOpen,
    duration: '6 min read',
    level: 'Intermediate',
    url: 'https://www.inc.com/articles/how-to-speak-effectively.html',
    source: 'Inc.com',
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    id: 5,
    title: 'Confident Body Language: The Complete Guide',
    description: 'Comprehensive guide by career coach on using body language to project confidence and credibility',
    type: 'Guide',
    icon: Zap,
    duration: '12 min read',
    level: 'Intermediate',
    url: 'https://www.mindtools.com/pages/article/public-speaking.htm',
    source: 'MindTools',
    color: 'from-orange-500/20 to-orange-600/20',
  },
  {
    id: 6,
    title: 'Harvard Study on Nonverbal Communication',
    description: 'Research-backed insights on how body posture affects confidence and audience perception',
    type: 'Article',
    icon: BookOpen,
    duration: '8 min read',
    level: 'Advanced',
    url: 'https://www.harpersbazaar.com/culture/features/a9651840/power-poses/',
    source: 'Harvard Research',
    color: 'from-pink-500/20 to-pink-600/20',
  },
  {
    id: 7,
    title: 'Storytelling Mastery for Presentations',
    description: 'Learn from professional speakers how to craft and deliver compelling stories that engage audiences',
    type: 'Video',
    icon: Video,
    duration: '20 min watch',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=oH50jJMVaAY',
    source: 'Duarte Design',
    color: 'from-cyan-500/20 to-cyan-600/20',
  },
  {
    id: 8,
    title: 'Managing Presentation Anxiety',
    description: 'Practical strategies from psychologists to overcome nervousness and build speaking confidence',
    type: 'Article',
    icon: BookOpen,
    duration: '9 min read',
    level: 'Beginner',
    url: 'https://www.psychologytoday.com/us/basics/public-speaking',
    source: 'Psychology Today',
    color: 'from-indigo-500/20 to-indigo-600/20',
  },
  {
    id: 9,
    title: 'The Art of Engaging Your Audience',
    description: 'Interactive techniques to capture attention, maintain engagement, and create memorable presentations',
    type: 'Guide',
    icon: Users,
    duration: '11 min read',
    level: 'Intermediate',
    url: 'https://blog.hootsuite.com/public-speaking-tips/',
    source: 'Hootsuite Blog',
    color: 'from-teal-500/20 to-teal-600/20',
  },
  {
    id: 10,
    title: 'Professional Speaking Skills Training',
    description: 'Free comprehensive course on essential speaking skills from industry experts and coaches',
    type: 'Video',
    icon: Video,
    duration: '30 min course',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=1Q7_YSQB2bE',
    source: 'Udacity',
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

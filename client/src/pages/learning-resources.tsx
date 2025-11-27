import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, Zap, Users } from 'lucide-react';

const LEARNING_RESOURCES = [
  {
    id: 1,
    title: 'Eye Contact Mastery',
    description: 'Learn techniques to maintain natural eye contact during presentations',
    type: 'Article',
    icon: BookOpen,
    duration: '5 min read',
    level: 'Beginner',
  },
  {
    id: 2,
    title: 'Speaking Pace & Pauses',
    description: 'Master the art of pacing and strategic pauses for better communication',
    type: 'Video',
    icon: Video,
    duration: '12 min watch',
    level: 'Intermediate',
  },
  {
    id: 3,
    title: 'Eliminate Filler Words',
    description: 'Practical techniques to remove "um," "uh," and "like" from your speech',
    type: 'Guide',
    icon: Zap,
    duration: '8 min read',
    level: 'Beginner',
  },
  {
    id: 4,
    title: 'Body Language Secrets',
    description: 'Understand how posture and gestures impact your audience perception',
    type: 'Article',
    icon: Users,
    duration: '6 min read',
    level: 'Beginner',
  },
  {
    id: 5,
    title: 'Confident Body Posture',
    description: 'Perfect posture techniques that make you feel and look more confident',
    type: 'Video',
    icon: Video,
    duration: '15 min watch',
    level: 'Intermediate',
  },
  {
    id: 6,
    title: 'Storytelling Techniques',
    description: 'Engage your audience with compelling stories and narratives',
    type: 'Course',
    icon: BookOpen,
    duration: '20 min course',
    level: 'Advanced',
  },
];

export default function LearningResources() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Learning Resources</h1>
          <p className="text-muted-foreground">Master the skills to become a confident public speaker</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEARNING_RESOURCES.map((resource) => {
            const Icon = resource.icon;
            const levelColor = {
              Beginner: 'bg-green-500/20 text-green-700',
              Intermediate: 'bg-blue-500/20 text-blue-700',
              Advanced: 'bg-purple-500/20 text-purple-700',
            };
            return (
              <Card key={resource.id} className="border-2 border-primary/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{resource.type}</Badge>
                    <Badge className={levelColor[resource.level as keyof typeof levelColor]}>
                      {resource.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{resource.duration}</p>
                  <Button className="w-full" variant="secondary">
                    Open Resource
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

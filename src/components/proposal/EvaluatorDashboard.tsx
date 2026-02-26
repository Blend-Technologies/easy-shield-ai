import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Text } from "recharts";

export type EvaluationResult = {
  overallScore: number;
  categories: { name: string; score: number; maxScore: number }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "hsl(var(--primary))";
  if (score >= 60) return "hsl(45, 93%, 47%)";
  if (score >= 40) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Moderate Match";
  if (score >= 40) return "Weak Match";
  return "Poor Match";
};

const ScoreGauge = ({ score }: { score: number }) => {
  const color = getScoreColor(score);
  const data = [
    { name: "score", value: score },
    { name: "remaining", value: 100 - score },
  ];

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  );
};

export const EvaluatorDashboard = ({ result }: { result: EvaluationResult }) => {
  const scoreColor = getScoreColor(result.overallScore);
  const scoreLabel = getScoreLabel(result.overallScore);

  return (
    <div className="space-y-4">
      {/* Top: Score + Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <ScoreGauge score={result.overallScore} />
              <div className="text-center mt-2">
                <Badge
                  variant="outline"
                  className="text-sm font-semibold"
                  style={{ borderColor: scoreColor, color: scoreColor }}
                >
                  <Target className="w-3 h-3 mr-1" />
                  {scoreLabel}
                </Badge>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-heading font-semibold text-lg text-foreground">RFP Match Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.categories.map((cat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">{cat.name}</span>
                <span className="font-semibold" style={{ color: getScoreColor(cat.score) }}>
                  {cat.score}%
                </span>
              </div>
              <Progress value={cat.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-green-500 mt-1 shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-amber-500 mt-1 shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Lightbulb className="w-4 h-4" /> Recommendations to Win
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="font-semibold text-primary shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

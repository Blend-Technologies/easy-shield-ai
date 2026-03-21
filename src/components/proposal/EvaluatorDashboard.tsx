import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Lightbulb, Target, Code2, Wrench } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export type TechnicalSkill = {
  skill: string;
  level: "required" | "preferred";
  reason: string;
};

export type TechStackItem = {
  name: string;
  category: string;
  required: boolean;
  context?: string;
};

export type EvaluationResult = {
  overallScore: number;
  categories: { name: string; score: number; maxScore: number }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  technicalSkills?: TechnicalSkill[];
  techStack?: TechStackItem[];
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

      {/* Technical Skills & Tech Stack */}
      {((result.technicalSkills?.length ?? 0) > 0 || (result.techStack?.length ?? 0) > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Technical Skills */}
          {(result.technicalSkills?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-violet-600 dark:text-violet-400">
                  <Code2 className="w-4 h-4" /> Technical Skills Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {result.technicalSkills!.map((s, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{s.skill}</span>
                        <Badge
                          variant="outline"
                          className={s.level === "required"
                            ? "text-destructive border-destructive/40 text-xs shrink-0"
                            : "text-amber-600 border-amber-400/40 text-xs shrink-0"}
                        >
                          {s.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tech Stack */}
          {(result.techStack?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <Wrench className="w-4 h-4" /> Tech Stack Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Group by category */}
                {Array.from(new Set(result.techStack!.map((t) => t.category))).map((cat) => (
                  <div key={cat} className="mb-3 last:mb-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.techStack!.filter((t) => t.category === cat).map((t, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className={`text-xs cursor-default ${t.required ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" : "opacity-70"}`}
                          title={t.context}
                        >
                          {t.name}
                          {t.required && <span className="ml-1 text-[9px] font-bold">★</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground mt-2">★ = mandatory per RFP · hover badge for context</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

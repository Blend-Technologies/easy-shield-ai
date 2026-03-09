import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

const IntendedLearnersStep = ({ objectives, onChange }: Props) => {
  const update = (i: number, val: string) => {
    const next = [...objectives];
    next[i] = val;
    onChange(next);
  };

  const remove = (i: number) => {
    if (objectives.length <= 4) return;
    onChange(objectives.filter((_, idx) => idx !== i));
  };

  const add = () => onChange([...objectives, ""]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Intended learners</h1>
      <div className="border-b border-border my-4" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        The following descriptions will be publicly visible on your{" "}
        <a href="#" className="text-primary underline">Course Landing Page</a>{" "}
        and will have a direct impact on your course performance. These descriptions will help learners decide if your course is right for them.
      </p>

      <h2 className="text-base font-bold text-foreground mb-1">
        What will students learn in your course?
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        You must enter at least 4{" "}
        <a href="#" className="text-primary underline">learning objectives or outcomes</a>{" "}
        that learners can expect to achieve after completing your course.
      </p>

      <div className="space-y-3">
        {objectives.map((obj, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={obj}
                onChange={(e) => update(i, e.target.value)}
                maxLength={160}
                placeholder="Example: Define the roles and responsibilities of a project manager"
                className="w-full h-10 rounded-md border border-border bg-background px-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {160 - obj.length}
              </span>
            </div>
            {objectives.length > 4 && (
              <button
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-4 text-primary gap-1"
        onClick={add}
      >
        <Plus className="h-4 w-4" /> Add more to your response
      </Button>
    </div>
  );
};

export default IntendedLearnersStep;

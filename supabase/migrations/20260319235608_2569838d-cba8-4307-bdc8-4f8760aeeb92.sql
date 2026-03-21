
-- XP totals per user
CREATE TABLE public.user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view XP" ON public.user_xp FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can upsert XP" ON public.user_xp FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- XP transaction log
CREATE TABLE public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  source text NOT NULL,
  source_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.xp_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON public.xp_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Streaks
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streaks" ON public.user_streaks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own streaks" ON public.user_streaks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Function to award XP + update streak
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _source text, _source_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := current_date;
  _last_date date;
  _current_streak integer;
BEGIN
  -- Upsert XP
  INSERT INTO public.user_xp (user_id, total_xp, updated_at)
  VALUES (_user_id, _amount, now())
  ON CONFLICT (user_id) DO UPDATE SET total_xp = user_xp.total_xp + _amount, updated_at = now();

  -- Log transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
  VALUES (_user_id, _amount, _source, _source_id);

  -- Update streak
  SELECT last_activity_date, current_streak INTO _last_date, _current_streak
  FROM public.user_streaks WHERE user_id = _user_id;

  IF _last_date IS NULL THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
    VALUES (_user_id, 1, 1, _today, now());
  ELSIF _last_date = _today THEN
    -- Already active today, no change
    NULL;
  ELSIF _last_date = _today - 1 THEN
    UPDATE public.user_streaks
    SET current_streak = _current_streak + 1,
        longest_streak = GREATEST(longest_streak, _current_streak + 1),
        last_activity_date = _today,
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_activity_date = _today,
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Trigger: award 10 XP on new post
CREATE OR REPLACE FUNCTION public.on_post_created() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_xp(NEW.user_id, 10, 'post', NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_post_xp AFTER INSERT ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.on_post_created();

-- Trigger: award 5 XP to post owner on like
CREATE OR REPLACE FUNCTION public.on_post_liked() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _post_owner uuid;
BEGIN
  SELECT user_id INTO _post_owner FROM public.community_posts WHERE id = NEW.post_id;
  IF _post_owner IS NOT NULL THEN
    PERFORM public.award_xp(_post_owner, 5, 'like', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_like_xp AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.on_post_liked();

-- Trigger: award 50 XP on course enrollment
CREATE OR REPLACE FUNCTION public.on_course_enrolled() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_xp(NEW.user_id, 50, 'enrollment', NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enrollment_xp AFTER INSERT ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.on_course_enrolled();

-- Trigger: award 20 XP on event RSVP
CREATE OR REPLACE FUNCTION public.on_event_rsvp() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_xp(NEW.user_id, 20, 'rsvp', NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_rsvp_xp AFTER INSERT ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.on_event_rsvp();

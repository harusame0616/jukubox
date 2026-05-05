CREATE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.users (user_id, nickname)
    VALUES (
        new_user_id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'user')
    );

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('user_id', new_user_id::text)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_handle_new_auth_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();

DO $$
DECLARE
    rec RECORD;
    new_user_id UUID;
BEGIN
    FOR rec IN
        SELECT id, raw_user_meta_data, email
        FROM auth.users
        WHERE (raw_app_meta_data->>'user_id') IS NULL
    LOOP
        new_user_id := gen_random_uuid();

        INSERT INTO public.users (user_id, nickname)
        VALUES (
            new_user_id,
            COALESCE(rec.raw_user_meta_data->>'name', split_part(rec.email, '@', 1), 'user')
        );

        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                              || jsonb_build_object('user_id', new_user_id::text)
        WHERE id = rec.id;
    END LOOP;
END;
$$;

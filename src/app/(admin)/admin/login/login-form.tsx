"use client";

import { useActionState } from "react";
import { signInAction, type LoginState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const initialState: LoginState = { error: null };

export function LoginForm({
  next,
  disabled = false,
}: {
  next?: string;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <Card>
      <CardContent>
        <form action={formAction} noValidate>
          <FieldGroup>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field data-invalid={Boolean(state.error) || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={disabled || isPending}
                aria-invalid={Boolean(state.error) || undefined}
              />
            </Field>
            <Field data-invalid={Boolean(state.error) || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={disabled || isPending}
                aria-invalid={Boolean(state.error) || undefined}
              />
              {state.error ? (
                <FieldDescription role="alert" className="text-destructive">
                  {state.error}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <Button type="submit" disabled={disabled || isPending}>
                {isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Accesso in corso…
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

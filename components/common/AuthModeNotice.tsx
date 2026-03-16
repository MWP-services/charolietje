import { InlineMessage } from '@/components/common/InlineMessage';
import { authBackendMode } from '@/lib/supabase';

type AuthModeNoticeProps = {
  compact?: boolean;
};

export const AuthModeNotice = ({ compact = false }: AuthModeNoticeProps) => {
  if (authBackendMode === 'supabase') {
    return (
      <InlineMessage
        title="Live accountmodus actief"
        description={
          compact
            ? 'Deze build gebruikt Supabase voor accountregistratie en e-mailverificatie.'
            : 'Deze build gebruikt Supabase voor accountregistratie, e-mailverificatie en wachtwoordherstel.'
        }
        tone="success"
      />
    );
  }

  return (
    <InlineMessage
      title="Mock accountmodus actief"
      description={
        compact
          ? 'Deze build is niet verbonden met Supabase. Nieuwe accounts en verificatiemails werken hier niet echt.'
          : 'Deze build is niet verbonden met Supabase. Registreren, verificatiemails en wachtwoordherstel blijven lokaal en verschijnen dus niet in Supabase Auth.'
      }
      tone="error"
    />
  );
};

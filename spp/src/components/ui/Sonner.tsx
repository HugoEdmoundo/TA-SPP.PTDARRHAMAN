import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'group rounded-xl border border-border bg-card text-card-foreground shadow-lg',
          title: 'text-sm font-bold',
          description: 'text-xs text-muted-foreground',
          success: 'text-emerald-primary',
          error: 'text-rose-danger',
          warning: 'text-amber-700',
          info: 'text-blue-700',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

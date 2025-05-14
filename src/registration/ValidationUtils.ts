
import { z } from 'zod';

export const emailSchema = z.string().email('E-mail inválido');

export const passwordSchema = z.string()
  .min(6, 'A senha deve ter pelo menos 6 caracteres')
  .refine(
    (password) => {
      return /[A-Z]/.test(password) && /[0-9]/.test(password);
    },
    {
      message: 'A senha deve conter pelo menos uma letra maiúscula e um número',
    }
  );

export const signUpSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

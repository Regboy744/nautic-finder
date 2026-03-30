import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createConversationBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const sendMessageBodySchema = z.object({
  message: z.string().min(1).max(2000),
});

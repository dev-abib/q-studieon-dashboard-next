import { z } from "zod";
import { createQuestionSchema } from "../schema/create-question.schema";

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

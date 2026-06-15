import { z } from "zod";
import { updateQuestionSchema } from "../schema/update-question.schema";

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

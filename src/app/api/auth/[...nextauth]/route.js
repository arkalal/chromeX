// This file is executed in a Node.js environment, not Edge runtime
// So it's safe to use the full auth.js with MongoDB connections
import { handlers } from "../../../../auth";

export const { GET, POST } = handlers;

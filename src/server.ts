import app from "./app";
import { startT48ReminderJob } from "./jobs/t48Reminder.job";
import { startTokenCleanupJob } from "./jobs/tokenCleanup.job";

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`readflow-api corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

startTokenCleanupJob();
startT48ReminderJob();

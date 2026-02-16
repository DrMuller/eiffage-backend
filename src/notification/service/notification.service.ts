import { MongoCollection } from "../../utils/mongo/MongoCollection";
import { User } from "../../auth/model/user";
import { sendRawEmail } from "./brevo.service";
import { SendHrCampaignRequestInput } from "../dto/notification.dto";
import { InternalServerErrorException, NotFoundException } from "../../utils/HttpException";

function getUsersCollection(): MongoCollection<User> {
    return new MongoCollection<User>("user");
}

export async function sendHrCampaignRequest(
    input: SendHrCampaignRequestInput,
    senderEmail: string
): Promise<void> {
    const usersCollection = getUsersCollection();

    // Find all users with RH or ADMIN role
    const adminUsers = await usersCollection.find({
        roles: { $in: ['RH', 'ADMIN'] }
    });

    if (adminUsers.length === 0) {
        throw new NotFoundException("Aucun administrateur RH trouvé pour envoyer la notification.");
    }

    const recipients = adminUsers.map(user => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
    }));

    const subject = "Demande d'activation d'une campagne d'évaluation";

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Bonjour,</p>
            <p>Je suis <strong>${input.managerName}</strong> et je souhaiterais lancer une évaluation des compétences pour mon équipe.</p>
            <p>Cependant, il n'y a actuellement aucune campagne d'évaluation active.</p>
            <p>Pourriez-vous activer une campagne d'évaluation afin que je puisse procéder à l'évaluation de mes collaborateurs ?</p>
            <p>Merci d'avance pour votre aide.</p>
            <p>Cordialement,<br/>${input.managerName}</p>
        </div>
    `.trim();

    const success = await sendRawEmail({
        to: recipients,
        subject,
        htmlContent,
        replyTo: { email: senderEmail }
    });

    if (!success) {
        throw new InternalServerErrorException("Échec de l'envoi de l'email. Veuillez réessayer plus tard.");
    }
}

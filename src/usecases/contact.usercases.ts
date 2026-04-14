import type { Contact, ContactCreate, ContactRepository } from '../interfaces/contacts.interface.js';
import type { userRepository } from '../interfaces/user.interface.js';

export class ContactUseCase {
    private contactRepository: ContactRepository;
    private userRepository: userRepository;

    constructor(contactRepository: ContactRepository, userRepository: userRepository) {

        this.contactRepository = contactRepository;

        this.userRepository = userRepository;
    }

    async create({ name, email, phone, userEmail }: ContactCreate): Promise<Contact> {
        const user = await this.userRepository.findbyEmail(userEmail);

        if (!user) {
            throw new Error('User not found');
        }   
        
        const contactExists = await this.contactRepository.findByEmailOrPhone(email, phone);

        if (contactExists) {
            throw new Error('Contact with this email or phone already exists');
        }

        const result = await this.contactRepository.create({
            name,
            email,
            phone,
            userId: user.id,
        });

        return result;
    }

    async listAllContacts(userEmail: string): Promise<Contact[]> {
        const user = await this.userRepository.findbyEmail(userEmail);

        if (!user) {
            throw new Error('User not found');
        }

        const contacts = await this.contactRepository.findAllContacts(user.id);

        return contacts;
    }


    async updateContact({ id, name, email, phone}: Contact): Promise<Contact> {
        const data = {
            id,
            name,
            email,
            phone
        };
        return {} as Contact;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.contactRepository.delete(id);
        if (!result) {
            throw new Error('Failed to delete contact');
        }           
        return true;
    }
}

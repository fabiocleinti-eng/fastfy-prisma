export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string
    updatedAt?: string
}

export interface UserCreate {
    name: string;
    email: string;
}

export interface userRepository {
    create(data: UserCreate): Promise<User>;
    findbyEmail(email: string): Promise<User | null>;
}

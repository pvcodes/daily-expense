export interface Bin {
	id?: number;
	uid: string;
	name: string;
	content: string;
	isMarkdown: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// id         Int      @id @default(autoincrement())
// uid        String   @unique
// name       String   @unique
// content    String
// userId     Int
// isMarkdown Boolean  @default(false)
// user       User     @relation(fields: [userId], references: [id])
// createdAt  DateTime @default(now())
// updatedAt  DateTime @default(now()) @updatedAt

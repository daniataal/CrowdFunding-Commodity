
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
    const previewText = `Welcome to the future of commodity trading, ${name}.`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-black text-white font-sans">
                    <Container className="mx-auto my-10 p-5 w-[580px]">
                        <Heading className="text-2xl font-bold text-red-500">
                            COMMODITY PLATFORM
                        </Heading>
                        <Section className="my-6">
                            <Heading className="text-xl font-semibold text-white">
                                Welcome, {name}!
                            </Heading>
                            <Text className="text-gray-300 text-base">
                                We are thrilled to have you on board. You now have access to
                                institutional-grade commodity investments, from Gold Bullion to
                                Lithium.
                            </Text>
                            <Text className="text-gray-300 text-base">
                                Your account is ready. Verify your identity (KYC) to start
                                investing today.
                            </Text>
                        </Section>
                        <Section className="text-center mt-8">
                            <Button
                                className="bg-red-600 text-white font-bold px-6 py-3 rounded-md hover:bg-red-700"
                                href="https://151.145.85.174/kyc-verification"
                            >
                                Complete Verification
                            </Button>
                        </Section>
                        <Text className="text-gray-500 text-xs mt-10 text-center">
                            © 2026 Commodity CrowdFunding. All rights reserved.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;

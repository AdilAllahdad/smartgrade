export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="text-center md:text-left">
                        <p className="text-sm">
                            © {currentYear} ExamSystem. All rights reserved.
                        </p>
                    </div>
                    <div className="flex space-x-6">
                        <a
                            href="#"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Terms of Service
                        </a>
                        <a
                            href="#"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

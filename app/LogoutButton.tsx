"use client";

import { useState } from "react";

type LogoutButtonProps = {
	className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	async function handleLogout() {
		setIsLoading(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			window.location.href = "/";
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<button type="button" onClick={handleLogout} className={className} disabled={isLoading}>
			{isLoading ? "Saliendo..." : "Salir"}
		</button>
	);
}

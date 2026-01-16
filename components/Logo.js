export default function Logo({ className = "" }) {
    return (
        <span className={`font-black tracking-tighter text-2xl flex items-center gap-0.5 ${className}`}>
            <span className="text-emerald-500 dark:text-white transition-colors duration-300">LAB</span>
            <span className="text-emerald-500 dark:text-white transition-colors duration-300">HOUR</span>
        </span>
    );
}

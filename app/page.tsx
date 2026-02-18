import AppMain from '@/components/AppMain';
import { isUsingDefaultPassword } from '@/lib/auth';

export default function Page() {
    const usingDefaultPass = isUsingDefaultPassword();

    return <AppMain isUsingDefaultPass={usingDefaultPass} />;
}

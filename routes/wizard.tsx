import { Head } from 'fresh';
import StreamWizard from '../islands/StreamWizard.tsx';

export default function WizardPage() {
  return (
    <div>
      <Head>
        <title>Find a Stream | Upstate Fishing</title>
      </Head>
      <div class='mb-6'>
        <h1 class='text-2xl font-bold text-slate-800'>Find a Stream</h1>
        <p class='text-slate-600 mt-1'>
          Discover trout streams near you or explore by region.
        </p>
      </div>
      <StreamWizard />
    </div>
  );
}

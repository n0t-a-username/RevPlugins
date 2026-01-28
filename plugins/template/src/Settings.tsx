import { Forms } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

const { FormText, FormInput } = Forms;

// Initialize defaults
if (!storage.words) {
  storage.words = Array(10).fill("");
}

export default function Settings() {
  useProxy(storage);

  return (
    <>
      <FormText>
        ⚠️ Messages saved here will be used by /raid.
        I am not responsible for whatever happens to your account.
      </FormText>

      <FormInput
        title="Spam Message 1"
        value={storage.words[0]}
        onChange={(v) => (storage.words[0] = v)}
      />
      <FormInput
        title="Spam Message 2"
        value={storage.words[1]}
        onChange={(v) => (storage.words[1] = v)}
      />
      <FormInput
        title="Spam Message 3"
        value={storage.words[2]}
        onChange={(v) => (storage.words[2] = v)}
      />
      <FormInput
        title="Spam Message 4"
        value={storage.words[3]}
        onChange={(v) => (storage.words[3] = v)}
      />
      <FormInput
        title="Spam Message 5"
        value={storage.words[4]}
        onChange={(v) => (storage.words[4] = v)}
      />
      <FormInput
        title="Spam Message 6"
        value={storage.words[5]}
        onChange={(v) => (storage.words[5] = v)}
      />
      <FormInput
        title="Spam Message 7"
        value={storage.words[6]}
        onChange={(v) => (storage.words[6] = v)}
      />
      <FormInput
        title="Spam Message 8"
        value={storage.words[7]}
        onChange={(v) => (storage.words[7] = v)}
      />
      <FormInput
        title="Spam Message 9"
        value={storage.words[8]}
        onChange={(v) => (storage.words[8] = v)}
      />
      <FormInput
        title="Spam Message 10"
        value={storage.words[9]}
        onChange={(v) => (storage.words[9] = v)}
      />
    </>
  );
}

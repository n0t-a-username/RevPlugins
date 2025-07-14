import { registerCommand } from "@vendetta/commands";
import { findByStoreName, findByProps } from "@vendetta/metro";

const UserStore = findByStoreName("UserStore");
const { uploadLocalFiles } = findByProps("uploadLocalFiles");
const token = findByProps("getToken").getToken();

let command;
export default {
  onLoad: () => {
    command = registerCommand({
      name: "getpfp",
      displayName: "petpet",
      displayDescription: "PetPet someone",
      description: "PetPet someone",
      options: [
        {
          name: "user",
          description: "The user(or their id) to be patted",
          type: 6,
          required: true,
          displayName: "user",
          displayDescription: "The user(or their id) to be patted",
        }
      ],
      execute: pcommand,
      applicationId: "-1",
      inputType: 1,
      type: 1,
    });
  },

  onUnload: () => {
    command();
  },
};

async function pcommand(args, ctx) {
  const user = await UserStore.getUser(args[0].value);
  const image = user.getAvatarURL(512);
  const data = await getApiData(image);

  return {
    content: image,
  };
}

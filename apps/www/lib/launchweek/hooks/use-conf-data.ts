/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createContext, useContext } from 'react';

export type PageState = 'registration' | 'ticket';

export type UserData = {
  id?: string;
  ticketNumber?: number;
  username?: string;
  name?: string;
};

type ConfDataContextType = {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  setPageState: React.Dispatch<React.SetStateAction<PageState>>;
};

export const ConfDataContext = createContext<ConfDataContextType | null>(null);

export default function useConfData() {
  const result = useContext(ConfDataContext);
  if (!result) {
    throw new Error();
  }
  return result;
}

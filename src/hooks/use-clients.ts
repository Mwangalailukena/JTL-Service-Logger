"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalClient } from "@/lib/db";
import { queueOperation } from "@/lib/sync-engine";

export function useClients() {
  const clients = useLiveQuery(() => db.clients.orderBy("name").toArray());

    const addClient = async (client: Omit<LocalClient, 'id' | 'firebaseId'>) => {

      const localId = await db.clients.add(client as LocalClient);

      const newClient = await db.clients.get(localId);

      if (newClient) {

        await queueOperation('clients', 'create', newClient);

      }

      return localId;

    };

  

    const updateClient = async (id: string, updates: Partial<LocalClient>) => {

      await db.clients.update(id, updates);

      const updatedClient = await db.clients.get(id);

      if (updatedClient) {

        await queueOperation('clients', 'update', updatedClient);

      }

    };

  

    const deleteClient = async (id: string, firebaseId: string) => {

      await db.clients.delete(id);

      await queueOperation('clients', 'delete', { id, firebaseId });

    };

  

    return { clients, addClient, updateClient, deleteClient };

  }

  
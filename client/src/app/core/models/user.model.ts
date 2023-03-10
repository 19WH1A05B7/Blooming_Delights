import { Cart } from './cart.model';
import { Plant } from './plant.model';
import { Receipt } from './receipt.model';

export class User {
  constructor(
    public username: string,
    public avatar: string,
    public isAdmin: boolean,
    public _id: string,
    public id: string,
    public commentsCount: number,
    public cart: Cart,
    public favoritePlants: Plant[],
    public receipts: Receipt[]
  ) { }
}

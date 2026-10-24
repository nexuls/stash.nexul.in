/**
 * `OneOf<Members>`: a union whose members cannot be mixed.
 *
 * A plain union is satisfied by anything assignable to one member, and object
 * literals are the one place TypeScript objects to extra properties. Pass the
 * value through a variable and a shape carrying every member's fields at once
 * type-checks happily. `OneOf` closes that by giving each member an optional
 * `never` for every key it does not declare, so a foreign key has no type it
 * can hold.
 */

/** Keys of every member of a union, rather than only the shared ones. */
export type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/**
 * `AllKeys` is a defaulted parameter rather than an inline computation: it has
 * to be resolved before the conditional below distributes, because inside the
 * distribution `Members` is one member and `keyof Members` no longer sees the
 * rest of the union.
 */
export type OneOf<
  Members extends object,
  AllKeys extends PropertyKey = KeysOfUnion<Members>,
> = Members extends unknown
  ? Members & Partial<Record<Exclude<AllKeys, keyof Members>, never>>
  : never;

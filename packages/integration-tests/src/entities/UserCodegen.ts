import {
  BaseEntity,
  Changes,
  Collection,
  ConfigApi,
  EntityFilter,
  EntityGraphQLFilter,
  EntityMetadata,
  EntityOrmField,
  fail,
  FilterOf,
  Flavor,
  GraphQLFilterOf,
  hasMany,
  hasManyToMany,
  hasOne,
  isLoaded,
  Lens,
  Loaded,
  LoadHint,
  loadLens,
  ManyToOneReference,
  newChangesProxy,
  newRequiredRule,
  OptsOf,
  OrderBy,
  PartialOrNull,
  setField,
  setOpts,
  ValueFilter,
  ValueGraphQLFilter,
} from "joist-orm";
import { Context } from "src/context";
import { IpAddress } from "src/entities/types";
import {
  Author,
  AuthorId,
  authorMeta,
  AuthorOrder,
  Comment,
  CommentId,
  commentMeta,
  newUser,
  User,
  userMeta,
} from "./entities";
import type { EntityManager } from "./entities";

export type UserId = Flavor<string, "User">;

export interface UserFields {
  id: { kind: "primitive"; type: number; unique: true; nullable: false };
  name: { kind: "primitive"; type: string; unique: false; nullable: never };
  email: { kind: "primitive"; type: string; unique: false; nullable: never };
  ipAddress: { kind: "primitive"; type: IpAddress; unique: false; nullable: undefined };
  createdAt: { kind: "primitive"; type: Date; unique: false; nullable: never };
  updatedAt: { kind: "primitive"; type: Date; unique: false; nullable: never };
  authorManyToOne: { kind: "m2o"; type: Author; nullable: undefined };
}

export interface UserOpts {
  name: string;
  email: string;
  ipAddress?: IpAddress | null;
  authorManyToOne?: Author | AuthorId | null;
  createdComments?: Comment[];
  likedComments?: Comment[];
}

export interface UserIdsOpts {
  authorManyToOneId?: AuthorId | null;
  createdCommentIds?: CommentId[] | null;
  likedCommentIds?: CommentId[] | null;
}

export interface UserFilter {
  id?: ValueFilter<UserId, never>;
  name?: ValueFilter<string, never>;
  email?: ValueFilter<string, never>;
  ipAddress?: ValueFilter<IpAddress, null>;
  createdAt?: ValueFilter<Date, never>;
  updatedAt?: ValueFilter<Date, never>;
  authorManyToOne?: EntityFilter<Author, AuthorId, FilterOf<Author>, null>;
  createdComments?: EntityFilter<Comment, CommentId, FilterOf<Comment>, null | undefined>;
  likedComments?: EntityFilter<Comment, CommentId, FilterOf<Comment>, null | undefined>;
}

export interface UserGraphQLFilter {
  id?: ValueGraphQLFilter<UserId>;
  name?: ValueGraphQLFilter<string>;
  email?: ValueGraphQLFilter<string>;
  ipAddress?: ValueGraphQLFilter<IpAddress>;
  createdAt?: ValueGraphQLFilter<Date>;
  updatedAt?: ValueGraphQLFilter<Date>;
  authorManyToOne?: EntityGraphQLFilter<Author, AuthorId, GraphQLFilterOf<Author>, null>;
  createdComments?: EntityGraphQLFilter<Comment, CommentId, GraphQLFilterOf<Comment>, null | undefined>;
  likedComments?: EntityGraphQLFilter<Comment, CommentId, GraphQLFilterOf<Comment>, null | undefined>;
}

export interface UserOrder {
  id?: OrderBy;
  name?: OrderBy;
  email?: OrderBy;
  ipAddress?: OrderBy;
  createdAt?: OrderBy;
  updatedAt?: OrderBy;
  authorManyToOne?: AuthorOrder;
}

export const userConfig = new ConfigApi<User, Context>();

userConfig.addRule(newRequiredRule("name"));
userConfig.addRule(newRequiredRule("email"));
userConfig.addRule(newRequiredRule("createdAt"));
userConfig.addRule(newRequiredRule("updatedAt"));

export abstract class UserCodegen extends BaseEntity<EntityManager> {
  static defaultValues: object = {};
  static readonly tagName = "u";
  static readonly metadata: EntityMetadata<User>;

  declare readonly __orm: EntityOrmField & {
    filterType: UserFilter;
    gqlFilterType: UserGraphQLFilter;
    orderType: UserOrder;
    optsType: UserOpts;
    fieldsType: UserFields;
    optIdsType: UserIdsOpts;
    factoryOptsType: Parameters<typeof newUser>[1];
  };

  readonly createdComments: Collection<User, Comment> = hasMany(
    commentMeta,
    "createdComments",
    "user",
    "user_id",
    undefined,
  );

  readonly authorManyToOne: ManyToOneReference<User, Author, undefined> = hasOne(
    authorMeta,
    "authorManyToOne",
    "userOneToOne",
  );

  readonly likedComments: Collection<User, Comment> = hasManyToMany(
    "users_to_comments",
    "likedComments",
    "liked_by_user_id",
    commentMeta,
    "likedByUsers",
    "comment_id",
  );

  constructor(em: EntityManager, opts: UserOpts) {
    super(em, userMeta, UserCodegen.defaultValues, opts);
    setOpts(this as any as User, opts, { calledFromConstructor: true });
  }

  get id(): UserId | undefined {
    return this.idTagged;
  }

  get idOrFail(): UserId {
    return this.id || fail("User has no id yet");
  }

  get idTagged(): UserId | undefined {
    return this.__orm.data["id"];
  }

  get idTaggedOrFail(): UserId {
    return this.idTagged || fail("User has no id tagged yet");
  }

  get name(): string {
    return this.__orm.data["name"];
  }

  set name(name: string) {
    setField(this, "name", name);
  }

  get email(): string {
    return this.__orm.data["email"];
  }

  set email(email: string) {
    setField(this, "email", email);
  }

  get ipAddress(): IpAddress | undefined {
    return this.__orm.data["ipAddress"];
  }

  set ipAddress(ipAddress: IpAddress | undefined) {
    setField(this, "ipAddress", ipAddress);
  }

  get createdAt(): Date {
    return this.__orm.data["createdAt"];
  }

  get updatedAt(): Date {
    return this.__orm.data["updatedAt"];
  }

  set(opts: Partial<UserOpts>): void {
    setOpts(this as any as User, opts);
  }

  setPartial(opts: PartialOrNull<UserOpts>): void {
    setOpts(this as any as User, opts as OptsOf<User>, { partial: true });
  }

  get changes(): Changes<User> {
    return newChangesProxy(this) as any;
  }

  load<U, V>(fn: (lens: Lens<User>) => Lens<U, V>, opts: { sql?: boolean } = {}): Promise<V> {
    return loadLens(this as any as User, fn, opts);
  }

  populate<H extends LoadHint<User>>(hint: H): Promise<Loaded<User, H>>;
  populate<H extends LoadHint<User>>(opts: { hint: H; forceReload?: boolean }): Promise<Loaded<User, H>>;
  populate<H extends LoadHint<User>, V>(hint: H, fn: (u: Loaded<User, H>) => V): Promise<V>;
  populate<H extends LoadHint<User>, V>(
    opts: { hint: H; forceReload?: boolean },
    fn: (u: Loaded<User, H>) => V,
  ): Promise<V>;
  populate<H extends LoadHint<User>, V>(hintOrOpts: any, fn?: (u: Loaded<User, H>) => V): Promise<Loaded<User, H> | V> {
    return this.em.populate(this as any as User, hintOrOpts, fn);
  }

  isLoaded<H extends LoadHint<User>>(hint: H): this is Loaded<User, H> {
    return isLoaded(this as any as User, hint);
  }
}

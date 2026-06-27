/**
 * CPEK custom ESLint rule — invariante de segurança (ARCHITECTURE §4.3, §8, §14).
 *
 * Proíbe o uso da instância BASE do Prisma (`prisma`) ou do helper de bootstrap
 * (`prismaBase`) dentro de `server/api/**`. Lá, todo acesso a dado de negócio
 * DEVE passar por `withTenant(tenantId, tx => ...)`. A instância base só é
 * permitida em bootstrap/auth/migrations/seed/utils — nunca nos handlers de rota.
 *
 * Bloqueia:
 *   - import { prisma } from '.../utils/prisma'
 *   - import { prismaBase } from '.../utils/prisma'
 *   - import prisma from '.../utils/prisma'  (default)
 *   - uso de identificadores globais `prisma`/`prismaBase` (auto-import do Nitro)
 *
 * Permite: withTenant, e (dentro do withTenant) o `tx` da transação.
 */

const FORBIDDEN_NAMES = new Set(['prisma', 'prismaBase'])

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Proíbe a instância base do Prisma em server/api/** — use withTenant (ARCHITECTURE §4.3).',
    },
    schema: [],
    messages: {
      noBasePrisma:
        "Cliente Prisma base ('{{name}}') é proibido em server/api/**. " +
        'Acesse o banco via withTenant(tenantId, tx => ...). Ver ARCHITECTURE §4.3.',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const src = String(node.source.value)
        if (!/(^|\/)(utils\/)?prisma$/.test(src) && !src.endsWith('/prisma')) return
        for (const spec of node.specifiers) {
          if (
            spec.type === 'ImportDefaultSpecifier' ||
            (spec.imported && FORBIDDEN_NAMES.has(spec.imported.name))
          ) {
            context.report({
              node: spec,
              messageId: 'noBasePrisma',
              data: { name: spec.local.name },
            })
          }
        }
      },
      // Auto-import / uso global (Nitro pode auto-importar de server/utils).
      Identifier(node) {
        if (!FORBIDDEN_NAMES.has(node.name)) return
        // ignora declarações e nomes de propriedade
        const p = node.parent
        if (!p) return
        if (
          (p.type === 'MemberExpression' && p.property === node && !p.computed) ||
          (p.type === 'Property' && p.key === node && !p.computed) ||
          p.type === 'ImportSpecifier' ||
          p.type === 'ImportDefaultSpecifier' ||
          p.type === 'VariableDeclarator' ||
          p.type === 'FunctionDeclaration' ||
          p.type === 'PropertyDefinition'
        ) {
          return
        }
        // sinaliza chamadas como prisma.entry.findMany(...)
        if (p.type === 'MemberExpression' && p.object === node) {
          context.report({ node, messageId: 'noBasePrisma', data: { name: node.name } })
        }
      },
    }
  },
}

export default {
  rules: {
    'no-base-prisma-in-api': rule,
  },
}
